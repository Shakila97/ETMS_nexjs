const User = require("../models/User")
const Employee = require("../models/Employee")
const generateToken = require("../utils/generateToken")
const nodemailer = require("nodemailer")

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Send welcome email to new user
const sendWelcomeEmail = async (user, tempPassword) => {
  try {
    const transporter = createEmailTransporter()

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Welcome to ETMS - Your Account Details",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Employee Tracking Management System</h2>
          <p>Hello ${user.username},</p>
          <p>Your account has been created successfully. Here are your login details:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><strong>Role:</strong> ${user.role}</p>
          </div>
          <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
          <p>You can access the system at: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
          <p>If you have any questions, please contact your administrator.</p>
          <p>Best regards,<br>ETMS Team</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("Welcome email sent successfully")
  } catch (error) {
    console.error("Error sending welcome email:", error)
  }
}

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createEmailTransporter()
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request - ETMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>You have requested to reset your password for your ETMS account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <p style="color: #e74c3c;"><strong>Note:</strong> This link will expire in 1 hour for security purposes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>ETMS Team</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("Password reset email sent successfully")
  } catch (error) {
    console.error("Error sending password reset email:", error)
  }
}

// Generate random password
const generateRandomPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Get user statistics
const getUserStats = async () => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const adminUsers = await User.countDocuments({ role: "admin" })
    const managerUsers = await User.countDocuments({ role: "manager" })
    const employeeUsers = await User.countDocuments({ role: "employee" })

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      roles: {
        admin: adminUsers,
        manager: managerUsers,
        employee: employeeUsers,
      },
    }
  } catch (error) {
    throw new Error("Error fetching user statistics")
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  generateRandomPassword,
  getUserStats,
}
