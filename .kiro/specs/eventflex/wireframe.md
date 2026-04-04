student registration process:

student browses events on the dashboard or "Browse Events" page and clicks "View Details" on an event card → lands on EventDetailPage

on the detail page, they see event info, capacity bar, and a "Register Now" button. if the event is full or past deadline, the button is disabled

clicking "Register Now" opens the RegistrationModal — a 3-step flow:

step 1 — fill personal details (name, BT ID, branch, year)
step 2 — choose solo or team (if team: add team name + member details)
step 3 — review summary + accept T&C → confirm
on confirm, two paths:

free event → hits POST /registrations directly
paid event → hits POST /payments/create-order first, opens Razorpay popup, student pays, then POST /payments/verify is called to confirm payment
on success → modal closes, queries invalidate (refreshes registration count), and a DigitalTicket modal pops up immediately with the ticket details

next time the student visits the same event detail page, they see "Already Registered" + a "View My Ticket" button that re-opens the ticket