import prisma from "../../prisma/client";

/**
 * Event Notification Worker
 *
 * Triggered when: An event organizer updates an event
 * Action: Finds all customers who booked tickets for the event and
 *         simulates sending them a notification about the update
 *
 * In production, this would integrate with email/push notification services
 */
export async function eventNotificationHandler(data: {
  eventId: string;
  eventTitle: string;
  updatedFields: string[];
}): Promise<void> {
  // Fetch all confirmed bookings for this event with customer details
  const bookings = await prisma.booking.findMany({
    where: {
      eventId: data.eventId,
      status: "CONFIRMED",
    },
    include: {
      customer: {
        select: { email: true, name: true },
      },
    },
  });

  if (bookings.length === 0) {
    console.log(`\n📭 No customers to notify for event: "${data.eventTitle}"\n`);
    return;
  }

  // Simulate a small delay for each notification
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔔 EVENT UPDATE NOTIFICATIONS`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Event:           ${data.eventTitle}`);
  console.log(`Updated Fields:  ${data.updatedFields.join(", ")}`);
  console.log(`Customers to notify: ${bookings.length}`);
  console.log(`${"─".repeat(60)}`);

  for (const booking of bookings) {
    console.log(
      `  📨 Notification sent to ${booking.customer.email} (${booking.customer.name}): ` +
        `Event "${data.eventTitle}" has been updated`
    );
  }

  console.log(`${"=".repeat(60)}\n`);
}
