/**
 * Booking Confirmation Worker
 *
 * Triggered when: A customer successfully books tickets
 * Action: Simulates sending a booking confirmation email via console log
 *
 * In production, this would integrate with an email service (SendGrid, AWS SES, etc.)
 */
export async function bookingConfirmationHandler(data: {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  eventTitle: string;
  numberOfTickets: number;
  totalPrice: number;
}): Promise<void> {
  // Simulate some processing delay (like an actual email API call)
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📧 BOOKING CONFIRMATION EMAIL`);
  console.log(`${"=".repeat(60)}`);
  console.log(`To:       ${data.customerEmail}`);
  console.log(`Subject:  Booking Confirmed - ${data.eventTitle}`);
  console.log(`${"─".repeat(60)}`);
  console.log(`Dear ${data.customerName},`);
  console.log(`Your booking has been confirmed!`);
  console.log(`  Booking ID:    ${data.bookingId}`);
  console.log(`  Event:         ${data.eventTitle}`);
  console.log(`  Tickets:       ${data.numberOfTickets}`);
  console.log(`  Total Price:   $${data.totalPrice.toFixed(2)}`);
  console.log(`Thank you for your purchase!`);
  console.log(`${"=".repeat(60)}\n`);
}
