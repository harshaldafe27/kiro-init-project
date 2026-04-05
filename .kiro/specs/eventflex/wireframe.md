student registration process:

1.student clicks "View Details" on an event card → lands on EventDetailPage

2.clicks "Register Now" → RegistrationModal opens (3 steps: personal details → solo/team → summary + T&C)

3.on confirm, two paths:

free event → POST /registrations directly → registration confirmed
paid event → POST /payments/create-order → Razorpay popup opens
student pays → POST /payments/verify → registration confirmed
student dismisses popup → modal closes, registration saved with paymentStatus: 'pending', info toast shown

4. on success → digital ticket shown immediately

5.if payment was dismissed → student goes to "My Registrations", sees the pending registration with a "💳 Complete Payment" button → clicking it calls POST /payments/retry-order → Razorpay reopens → on payment, POST /payments/verify confirms it

6. returning to any event detail page where already registered → shows "Already Registered" + "🎫 View My Ticket" button