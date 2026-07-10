import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    // Check if API key is set
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY not found in environment variables',
        success: false
      }, { status: 400 })
    }
    
    // Try sending a test email to yourself (must be your Resend account email for testing)
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's test domain
      to: 'jesselingard990@gmail.com', // Your Resend account email
      subject: 'Test Newsletter - Fàdè',
      html: `
        <h1>🎉 Newsletter Integration Working!</h1>
        <p>This is a test email from your Fàdè store.</p>
        <p>Your Resend integration is set up correctly.</p>
        <hr>
        <p><small>If you received this, you're all set to send newsletters!</small></p>
      `
    })
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message || 'Failed to send test email'
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully!',
      emailId: data?.id,
      note: 'Check your inbox (and spam folder) for the test email.'
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Make sure RESEND_API_KEY is set in your .env file'
    }, { status: 500 })
  }
}
