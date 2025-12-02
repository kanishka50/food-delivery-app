# SMS Testing & Configuration Guide

## Notify.lk API Testing Features

### ✅ What Notify.lk Provides for Testing

1. **Free Testing Credits**
   - New accounts receive free credits for testing
   - No credit card required for trial period
   - Can test all API features with free credits

2. **Demo Sender ID: "NotifyDEMO"**
   - Available for initial testing
   - **⚠️ IMPORTANT RESTRICTION:** Do NOT send OTP messages with NotifyDEMO
   - Your account can be suspended for sending OTP with demo sender
   - Only use for general SMS testing

3. **API Testing Endpoint**
   ```
   https://app.notify.lk/api/v1/send
   ```

### ❌ What Notify.lk Does NOT Provide

- **No dedicated sandbox environment** - Uses production API with free credits
- **No test phone numbers** - Must use real phone numbers
- **No OTP testing with demo sender** - Need approved sender ID for OTP

---

## Our SMS Testing Solution

We've implemented a **flexible SMS abstraction layer** that allows you to switch between different SMS providers **WITHOUT changing any code** - just update your `.env` file!

### Available SMS Drivers

1. **`log` (Development/Testing)** - Default
   - Logs SMS to Laravel log file
   - Outputs to console during testing
   - Perfect for local development
   - **No cost, no API calls**

2. **`notifylk` (Production)**
   - Sends real SMS via Notify.lk
   - Uses your actual credits
   - For staging and production environments

---

## Configuration

### Step 1: Environment Variables

Add these to your `.env` file:

#### For Local Development/Testing (FREE - No SMS sent)
```env
# SMS Configuration - Development/Testing
SMS_DRIVER=log
```

#### For Production (Real SMS via Notify.lk)
```env
# SMS Configuration - Production
SMS_DRIVER=notifylk

# Notify.lk Credentials (get from https://app.notify.lk/settings)
NOTIFYLK_USER_ID=your_user_id_here
NOTIFYLK_API_KEY=your_api_key_here
NOTIFYLK_SENDER_ID=YourBrand  # Your approved sender ID (NOT NotifyDEMO for OTP!)
```

#### For Notify.lk Testing with Free Credits
```env
# SMS Configuration - Notify.lk Testing
SMS_DRIVER=notifylk

# Notify.lk Test Credentials
NOTIFYLK_USER_ID=your_user_id_here
NOTIFYLK_API_KEY=your_api_key_here
NOTIFYLK_SENDER_ID=NotifyDEMO  # Use ONLY for non-OTP testing!
```

### Step 2: Get Notify.lk Credentials

1. **Sign up** at [https://www.notify.lk/](https://www.notify.lk/)
2. **Get free test credits** automatically on registration
3. **Find your credentials** at: https://app.notify.lk/settings
   - User ID
   - API Key
4. **Request Sender ID** (for production OTP):
   - Go to Settings > Sender IDs
   - Click "Request New"
   - Use your brand name (e.g., "FoodDlvry", "MyApp")
   - **Required for OTP messages**

---

## Usage in Code

### Basic Usage
```php
use App\Services\SMS\SMSInterface;

class AuthController extends Controller
{
    protected SMSInterface $smsService;

    public function __construct(SMSInterface $smsService)
    {
        $this->smsService = $smsService;
    }

    public function sendOTP(Request $request)
    {
        $otpCode = rand(100000, 999999);

        // This works with BOTH 'log' and 'notifylk' drivers!
        $result = $this->smsService->sendOTP(
            $request->phone_number,
            $otpCode,
            'registration'
        );

        if ($result['success']) {
            // Save OTP to database
            // Return success response
        }
    }
}
```

### Send Custom SMS
```php
$result = $this->smsService->send(
    '94771234567',
    'Your order #1234 has been delivered!'
);
```

### Send OTP with Purpose
```php
// Available purposes: 'registration', 'password_reset', 'phone_change', 'login'
$result = $this->smsService->sendOTP(
    '94771234567',
    '123456',
    'password_reset'
);
```

---

## Testing Strategy

### Phase 1: Local Development (FREE)
```env
SMS_DRIVER=log
```
- All SMS appear in `storage/logs/laravel.log`
- Console output shows OTP codes
- Zero cost, fast development
- **Use this for most development**

### Phase 2: Notify.lk Free Credits Testing (General SMS)
```env
SMS_DRIVER=notifylk
NOTIFYLK_SENDER_ID=NotifyDEMO
```
- Test real SMS delivery
- Verify message formatting
- Check phone number handling
- **⚠️ DO NOT send OTP with NotifyDEMO**

### Phase 3: Production Sender ID Testing (OTP)
```env
SMS_DRIVER=notifylk
NOTIFYLK_SENDER_ID=YourBrand  # Your approved sender ID
```
- Test OTP delivery
- Verify OTP messages work
- Test with small credits first

### Phase 4: Production
```env
SMS_DRIVER=notifylk
NOTIFYLK_SENDER_ID=YourBrand
```
- Full production deployment

---

## Phone Number Formats

Our service automatically handles multiple phone number formats:

**Accepted Formats:**
- `+94771234567` (International)
- `94771234567` (With country code)
- `0771234567` (Sri Lankan format)
- `771234567` (Without leading zero)

**Output Format:** `94771234567` (Notify.lk format)

---

## Switching Between Testing and Production

### Scenario 1: Development to Production
**Change only in `.env`:**
```env
# Before (Development)
SMS_DRIVER=log

# After (Production)
SMS_DRIVER=notifylk
NOTIFYLK_USER_ID=your_user_id
NOTIFYLK_API_KEY=your_api_key
NOTIFYLK_SENDER_ID=YourBrand
```

**No code changes needed!** ✅

### Scenario 2: Different Environments
```env
# .env.local (Development)
SMS_DRIVER=log

# .env.staging (Staging with real SMS)
SMS_DRIVER=notifylk
NOTIFYLK_SENDER_ID=NotifyDEMO

# .env.production (Production)
SMS_DRIVER=notifylk
NOTIFYLK_SENDER_ID=YourBrand
```

---

## Important Notify.lk Restrictions

### ⚠️ DO NOT:
- Send OTP messages with `NotifyDEMO` sender ID
- Use demo sender for production
- Share API credentials publicly

### ✅ DO:
- Get your own sender ID approved before production
- Include your brand name in OTP messages
- Use `log` driver for development
- Test with free credits first
- Monitor your credit balance

---

## Troubleshooting

### SMS Not Sending (Notify.lk)

1. **Check credentials:**
   ```bash
   php artisan tinker
   config('services.notifylk.user_id')
   config('services.notifylk.api_key')
   ```

2. **Check driver:**
   ```bash
   config('services.sms.driver')
   ```

3. **Check service availability:**
   ```php
   app(SMSInterface::class)->isAvailable()
   ```

4. **Check logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

### OTP Not Received

1. **Using NotifyDEMO?** → Get approved sender ID
2. **Check phone number format**
3. **Check Notify.lk credit balance**
4. **Verify sender ID is approved**

---

## Cost Estimation

**Notify.lk Pricing (Approximate):**
- 1 SMS ≈ LKR 0.25 - 0.50
- 1000 OTPs ≈ LKR 250 - 500
- Free credits for testing

**Development Cost:**
- Using `log` driver: **FREE** ✅

---

## Additional Testing Methods

If you want even more testing options, you can create additional drivers:

### Option 1: Fake SMS Driver
```php
// Store OTPs in session/cache for testing
class FakeSMSService implements SMSInterface
{
    public function sendOTP($phone, $otp, $purpose)
    {
        Cache::put("otp:{$phone}", $otp, 300);
        return ['success' => true];
    }
}
```

### Option 2: Email SMS Driver
```php
// Send SMS content via email for testing
class EmailSMSService implements SMSInterface
{
    public function sendOTP($phone, $otp, $purpose)
    {
        Mail::to('test@example.com')->send(
            new OTPEmail($phone, $otp)
        );
    }
}
```

Just add to `SMSServiceProvider` and configure in `.env`!

---

## Summary

✅ **Development:** Use `SMS_DRIVER=log` (FREE, no setup)
✅ **Testing:** Use `SMS_DRIVER=log` or NotifyDEMO (free credits)
✅ **Production:** Use `SMS_DRIVER=notifylk` with approved sender ID
✅ **Switch providers:** Change `.env` only, no code changes!

---

## References

- [Notify.lk Official Site](https://www.notify.lk/)
- [Notify.lk API Documentation](https://developer.notify.lk/api-endpoints/)
- [Notify.lk FAQ](https://www.notify.lk/frequently-asked-questions/)
- [Get Notify.lk Credentials](https://app.notify.lk/settings)
