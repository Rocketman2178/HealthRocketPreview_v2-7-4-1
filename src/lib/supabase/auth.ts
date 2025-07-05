import { supabase } from "./client";
import { AuthError } from "../errors";

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  } catch (err) {
    console.error("Password reset error:", err);
    throw new AuthError("Failed to send reset email", err);
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  } catch (err) {
    console.error("Password update error:", err);
    throw new AuthError("Failed to update password", err);
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login")) {
        throw new AuthError("Invalid email or password");
      }
      throw error;
    }
  } catch (err) {
    console.error("Sign in error:", err);
    throw new AuthError("Failed to sign in", err);
  }
}

export async function signUp(email: string, password: string, name: string, launchCode: string = '', plan: string = 'Pro Plan') {
  try {
    // Validate launch code first
    if (launchCode.trim()) {
      // Validate the launch code regardless of which code it is
      const { data: validationData, error: validationError } = await supabase.rpc(
        'validate_launch_code',
        { p_code: launchCode }
      );

      if (validationError) {
        console.error('Launch code validation error:', validationError);
        throw new AuthError('Failed to validate launch code. Please try again.');
      }
      
      if (!validationData || !validationData.valid) {
        throw new AuthError(
          validationData?.error || 
          'Launch Code is not valid or has been fully subscribed. Please contact support at support@healthrocket.app for more info.'
        );
      }

      // Check if the launch code has a community associated with it
      if (validationData.has_community) {
        console.log(`Launch code ${launchCode} auto-enrolls into community: ${validationData.community_name}`);
      }
      
      // Special handling for LAUNCH100 code - set plan to Preview Access
      if (launchCode.toUpperCase() === 'LAUNCH100' || launchCode.toUpperCase() === 'EMERGEPREVIEW') {
        console.log('Preview code detected - setting up Preview Access plan');
        plan = 'Preview Access';
      } else if (launchCode.toUpperCase() === 'EMERGEPREVIEW' || launchCode.toUpperCase() === 'EOPREVIEW') {
        console.log('Preview code detected - setting up Pro Plan with Preview status');
        plan = 'Pro Plan';
      } else if (launchCode.toUpperCase() === 'FOUNDERS') {
        console.log('FOUNDERS code detected - setting up Founders League plan');
        plan = 'Founders League';
      }
    }

    // Create auth user
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, launchCode },
      },
    });

    if (signUpError) throw signUpError;
    if (!data.user) throw new Error("No user returned from signup");

    // Use the launch code if provided (for all launch codes including Launch100)
    if (launchCode.trim()) {
      const { error: usageError } = await supabase.rpc(
        'use_launch_code', 
        { 
          p_user_id: data.user.id,
          p_code: launchCode
        }
      );

      if (usageError) throw usageError;
    }

    // Create user profile
    // Set plan_status based on plan type
    let planStatus = 'Trial';
    if (plan === 'Preview Access') {
      planStatus = 'Preview'; 
    } else if (plan === 'Pro Plan' && (launchCode.toUpperCase() === 'EMERGEPREVIEW' || launchCode.toUpperCase() === 'EOPREVIEW')) {
      planStatus = 'Preview';
    } else if (plan === 'Founders League') {
      planStatus = 'Founders League';
    } else if (plan === 'Founders League') {
      planStatus = 'Founders League';
    }
    
    const { error: profileError } = await supabase.from("users").insert({
      id: data.user.id,
      email,
      name,
      plan: plan,
      subscription_start_date: new Date().toISOString(), // Track when subscription started for trial period
      plan_status: planStatus, // Set initial status based on plan type
     level: 1, 
      fuel_points: 0,
      burn_streak: 0,
      health_score: 7.8,
      healthspan_years: 0,
     onboarding_completed: false
    });

    if (profileError) throw profileError;
  } catch (err) {
    console.error("Sign up error:", err);
    // Preserve the original error message from AuthError
    if (err instanceof AuthError) {
      throw err;
    } else {
      throw new AuthError("Failed to create account", err);
    }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  localStorage.clear();
  sessionStorage.clear();
}