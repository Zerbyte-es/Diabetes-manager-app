// server.js - Backend Node.js / Express snippet with 30-Minute Escalation Loop
const express = require('express');
const cron = require('node-cron');
const app = express();
app.use(express.json());

// Mock Database (Replace with Supabase / PostgreSQL in production)
let db = {
    schedules: [
        {
            id: "sched_01",
            user_id: "user_123",
            scheduled_time: new Date(Date.now() - 40 * 60 * 1000), // Due 40 mins ago (missed)
            status: "pending",
            last_reminder_sent_at: null,
            escalation_count: 0
        }
    ],
    users: [
        { id: "user_123", fcm_token: "device_push_token_abc", name: "John Doe" }
    ]
};

// ==========================================
# 1. API Endpoint: User Uploads Sugar Result
// ==========================================
app.post('/api/glucose/upload', (req, and) => {
    const { user_id, glucose_level } = req.body;

    // Find active pending schedule for user
    const schedule = db.schedules.find(s => s.user_id === user_id && s.status === 'pending');
    
    if (schedule) {
        // Mark schedule as completed
        schedule.status = 'completed';
        schedule.escalation_count = 0;
    }

    // Check clinical safety threshold (e.g., > 200 mg/dL)
    let isCritical = glucose_level > 200;

    return res.status(200).json({
        success: true,
        message: "Result uploaded successfully.",
        alert_doctor: isCritical,
        trend: isCritical ? "red_down" : "green_up"
    });
});

// ==========================================
# 2. Background Worker: 30-Minute Escalation Loop
// Runs every 1 minute to check for overdue items
// ==========================================
cron.schedule('* * * * *', () => {
    const now = new Date();
    console.log("Running background check for missed sugar checks...");

    db.schedules.forEach(schedule => {
        if (schedule.status === 'pending') {
            const timeSinceScheduled = now - new Date(schedule.scheduled_time);
            const minutesOverdue = Math.floor(timeSinceScheduled / (1000 * 60));

            // If overdue by 30 minutes or multiples thereof (30 min, 60 min, etc.)
            if (minutesOverdue >= 30) {
                const lastSent = schedule.last_reminder_sent_at ? new Date(schedule.last_reminder_sent_at) : null;
                const minutesSinceLastReminder = lastSent ? Math.floor((now - lastSent) / (1000 * 60)) : 30;

                // Send reminder every 30 minutes until completed
                if (minutesSinceLastReminder >= 30) {
                    triggerPushNotification(schedule.user_id, schedule.escalation_count + 1);
                    
                    // Update tracking info
                    schedule.last_reminder_sent_at = now;
                    schedule.escalation_count += 1;
                }
            }
        }
    });
});

function triggerPushNotification(userId, attemptNumber) {
    const user = db.users.find(u => u.id === userId);
    console.log(`[ESCALATION ALERT #${attemptNumber}] Sending push notification to ${user.name}: "⚠️ URGENT: You have not checked your blood sugar yet! Please check and upload your result immediately."`);
    // In production, integrate Firebase Cloud Messaging (FCM) or Web Push API here.
}

app.listen(3000, () => console.log('GlucoCare Backend running on port 3000'));
