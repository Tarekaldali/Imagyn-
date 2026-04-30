# Testing the New Navigation Bar & Credit System

## Quick Start

1. **Open the website:**
   ```
   http://localhost:8890/index.html
   ```

2. **Login with test credentials:**
   - Email: your-test-user@email.com
   - Password: your-password

3. **Check navbar appearance:**
   - Should see: Logo | AI Model | Credits | Profile
   - Should NOT see: Workflow, Generated Count, Clear, Home buttons

---

## Test Cases

### ✅ Test 1: Login Required
**Steps:**
1. Open website without logging in
2. Fill out prompt
3. Click "Generate" button

**Expected Result:**
- Alert: "Please login to generate images"
- Redirect to login page

---

### ✅ Test 2: Credit Check
**Steps:**
1. Login with account that has 5 credits
2. Try to generate an image

**Expected Result:**
- Alert: "Insufficient credits! You need 10 credits to generate an image. Current balance: 5 credits."
- Generation blocked

---

### ✅ Test 3: Successful Generation
**Steps:**
1. Login with account that has 100+ credits
2. Note current credit balance
3. Enter a prompt (e.g., "beautiful landscape")
4. Click "Generate"

**Expected Result:**
- Credits reduced by 10 (100 → 90)
- Credit display updates with red flash animation
- Returns to green after 300ms
- Image generation starts

---

### ✅ Test 4: Multiple Generations
**Steps:**
1. Start with 100 credits
2. Generate 5 images in a row

**Expected Result:**
- 1st image: 100 → 90 credits
- 2nd image: 90 → 80 credits
- 3rd image: 80 → 70 credits
- 4th image: 70 → 60 credits
- 5th image: 60 → 50 credits

---

### ✅ Test 5: Credit Display Animation
**Steps:**
1. Have credits visible in navbar
2. Generate an image
3. Watch the credits display

**Expected Result:**
- Display scales up (1.1x) briefly
- Color changes to red (#ef4444)
- After 300ms, scales back to normal
- Color returns to green (#22c55e)

---

### ✅ Test 6: User Profile Dropdown
**Steps:**
1. Click on user profile button (👤 User ▼)
2. Check dropdown contents

**Expected Result:**
- Dropdown appears below button
- Shows "Signed in as"
- Shows user email
- Shows logout button
- Clicking outside closes dropdown

---

### ✅ Test 7: Hover Effects
**Steps:**
1. Hover over credit display
2. Hover over profile button

**Expected Result:**
- **Credits hover:**
  - Lifts up 2px
  - Background lightens
  - Shadow appears
  - Smooth transition

- **Profile hover:**
  - Lifts up 2px
  - Background lightens
  - Shadow appears
  - Smooth transition

---

### ✅ Test 8: Responsive Design
**Steps:**
1. Test on different screen sizes
2. Resize browser window

**Expected Result:**
- Desktop (>1200px): All elements visible, full spacing
- Tablet (768-1200px): Slightly condensed but readable
- Mobile (<768px): Minimal layout, icons only

---

### ✅ Test 9: Credit Persistence
**Steps:**
1. Login and check credits (e.g., 100)
2. Generate 1 image (should be 90)
3. Refresh page (F5)
4. Check credits again

**Expected Result:**
- Credits should still show 90
- Stored in localStorage
- Persists across refreshes

---

### ✅ Test 10: Model Status Display
**Steps:**
1. Observe AI model indicator in navbar
2. Generate an image
3. Watch status change

**Expected Result:**
- Default: "Stable Diffusion 1.5" + "Ready" (green)
- During generation: May show different status
- After completion: Returns to "Ready"

---

## Visual Inspection Checklist

### Navbar Layout:
- [ ] Logo and brand on left side
- [ ] AI model indicator in center
- [ ] Credits display on right (before profile)
- [ ] User profile button on far right
- [ ] No workflow status visible
- [ ] No generated counter visible
- [ ] No clear button visible
- [ ] No home button visible

### Styling:
- [ ] Credits have green background
- [ ] Credits have coin icon
- [ ] Profile has user icon
- [ ] Profile has dropdown arrow
- [ ] All elements properly aligned
- [ ] Spacing looks professional
- [ ] Colors match design system

### Interactions:
- [ ] Credits display updates on generation
- [ ] Credits show animation on change
- [ ] Profile dropdown opens on click
- [ ] Profile dropdown closes on outside click
- [ ] Hover effects work smoothly
- [ ] All transitions are smooth (0.3s)

---

## Common Issues & Solutions

### Issue 1: Credits not updating
**Solution:** Check browser console for errors, verify localStorage

### Issue 2: Animation not visible
**Solution:** Check CSS transitions, clear browser cache

### Issue 3: Dropdown not closing
**Solution:** Check JavaScript event listeners, verify DOM structure

### Issue 4: Credits showing "0 Credits"
**Solution:** 
- Login again
- Check localStorage: `localStorage.getItem('user_credits')`
- Set manually: `localStorage.setItem('user_credits', '100')`

---

## Browser Console Commands

### Check current credits:
```javascript
localStorage.getItem('user_credits')
```

### Set credits manually (for testing):
```javascript
localStorage.setItem('user_credits', '100')
location.reload()
```

### Check if logged in:
```javascript
localStorage.getItem('access_token')
localStorage.getItem('user_id')
```

### View all stored data:
```javascript
Object.keys(localStorage).forEach(key => {
    console.log(key, '=', localStorage.getItem(key))
})
```

---

## Performance Testing

### Load Time:
- [ ] Navbar renders in <100ms
- [ ] No flickering on page load
- [ ] Smooth transitions

### Animation Performance:
- [ ] Credit animation runs smoothly
- [ ] No lag on hover effects
- [ ] Dropdown opens without delay

---

## Accessibility Testing

### Keyboard Navigation:
- [ ] Can tab to profile button
- [ ] Can open dropdown with Enter
- [ ] Can navigate dropdown with arrows

### Screen Reader:
- [ ] Credit amount is read correctly
- [ ] Profile button has proper label
- [ ] Dropdown items are accessible

---

## Final Verification

Before marking as complete, verify:
- [x] Navigation bar simplified (removed 4 elements)
- [x] Credit system implemented (10 credits per image)
- [x] Credit display updates automatically
- [x] Animation plays on credit change
- [x] Login required enforcement
- [x] Insufficient credit warning
- [x] Professional styling applied
- [x] Hover effects working
- [x] Responsive design intact
- [x] No console errors

---

**Status:** Ready for Production Testing ✅
**Last Updated:** October 14, 2025
