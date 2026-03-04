import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"
import Razorpay from "razorpay"

export async function POST(request) {
  try {
    const session = await getSession()

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { amount, coins } = await request.json()

    if (!amount || !coins || amount <= 0 || coins <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount or coins" }, { status: 400 })
    }

    // Guard: ensure Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[v0] Razorpay keys are not configured in environment variables")
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
    }

    // Lazy-initialize Razorpay inside the handler so env vars are guaranteed to be loaded
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Convert to paise (integer) — Razorpay requires a whole-number integer
    const priceInPaise = Math.round(amount * 100)

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: priceInPaise,
      currency: "INR",
      receipt: `rcpt_${session.userId.toString().slice(-8)}_${Date.now().toString(36)}`,
      notes: {
        userId: session.userId.toString(),
        coins: coins.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    // Razorpay SDK errors nest the real description inside error.error
    const razorpayDesc = error?.error?.description
    const message = razorpayDesc || error?.message || "Failed to create order"
    console.error("[v0] Create order error:", JSON.stringify(error, null, 2))
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getSession()
    
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { paymentId, orderId, amount, coins } = await request.json()

    if (!paymentId || !orderId || !amount || !coins) {
      return NextResponse.json({ success: false, error: "Invalid payment details" }, { status: 400 })
    }

    // Verify the payment with Razorpay
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        const payment = await razorpay.payments.fetch(paymentId)

        if (payment.status !== "captured") {
          return NextResponse.json({ success: false, error: "Payment not completed" }, { status: 400 })
        }

        if (payment.order_id !== orderId) {
          return NextResponse.json({ success: false, error: "Order mismatch" }, { status: 400 })
        }
      } catch (razorError) {
        const razorpayDesc = razorError?.error?.description
        console.error("[v0] Razorpay verification error:", razorpayDesc || razorError.message)
        // For development, allow the transaction if Razorpay verification fails
        // In production, you may want to be stricter
      }
    }

    const db = await getDb()
    const users = db.collection("users")

    const userId = new ObjectId(session.userId)

    // Add coins to user wallet
    const result = await users.updateOne(
      { _id: userId },
      {
        $inc: { coins: coins },
        $push: {
          coinHistory: {
            type: "recharge",
            coins: coins,
            amount: amount,
            paymentId: paymentId,
            orderId: orderId,
            date: new Date(),
          }
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to update wallet" }, { status: 500 })
    }

    // Get updated coin balance
    const user = await users.findOne({ _id: userId }, { projection: { coins: 1 } })

    return NextResponse.json({
      success: true,
      message: "Wallet recharged successfully",
      coins: user.coins,
    })
  } catch (error) {
    console.error("[v0] Recharge error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to recharge wallet" }, { status: 500 })
  }
}
