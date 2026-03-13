# Signup Fix TODO

**Status**: Approved - implementing empty email fix

## Steps:
- [x] Create TODO.md ✅
- [x] Edit app/api/auth/signup/route.js → set email: null if no email ✅
- [x] Test new signup (mobile: 7740866666) ✅
- [x] Verify admin login still works ✅ 
- [x] Complete task ✅

## Changes:
```
app/api/auth/signup/route.js
- email: email ? email.toLowerCase().trim() : "",
+ email: email ? email.toLowerCase().trim() : null,
```

