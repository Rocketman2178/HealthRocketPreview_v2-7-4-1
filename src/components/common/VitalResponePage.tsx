import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase/client";
import { Check, X } from "lucide-react";
import { useSupabase } from "../../contexts/SupabaseContext";
import LoadingSpinner from "./LoadingSpinner";

export const VitalResponsePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [state, setState] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  
  const { user } = useSupabase();

  useEffect(() => {
    const processStatus = async () => {
      setLoading(true);

      const stateParam = searchParams.get("state");
      const providerParam = searchParams.get("provider");
      
      console.log("VitalResponsePage - Processing response with state:", stateParam, "provider:", providerParam);

      if (stateParam === "success" && providerParam) {
        try {
          // Update device status directly
          const { data, error } = await supabase
            .from("user_devices")
            .update({ status: "active" })
            .eq("user_id", user?.id)
            .eq("provider", providerParam);

          if (error) {
            console.error("Error updating device status:", error);
            throw error;
          } else {
            console.log("Device status updated successfully");
          }

          setState(stateParam);
          setProvider(providerParam);
          setMessage("Device successfully linked!");
          
          // Trigger dashboard update to show FP earned
          window.dispatchEvent(new CustomEvent('dashboardUpdate', {
            detail: { 
              fpEarned: 10,
              updatedPart: 'device', 
              category: 'general' 
            }
          }));
          
        } catch (error) {
          console.error("Error in VitalResponsePage:", error);
          console.error("Error in VitalResponsePage:", error);
          setMessage("An error occurred while updating your device status. Please try again.");
        }
      } else {
        // Only show error if parameters were expected but missing
        if (stateParam || providerParam) {
          setMessage("Invalid request or missing parameters.");
        } else {
          setMessage("Connecting to your device...");
        }
      }

      setLoading(false);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/connect-device");
      }, 3000);
    };

    processStatus();
  }, [searchParams, user?.id, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center max-w-md w-full border border-gray-700">
        <div className="mb-4">
          {state === "success" ? (
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="text-green-500" size={32} />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <X className="text-red-500" size={32} />
            </div>
          )}
        </div>
        
        {state === "success" ? (
          <h2 className="text-green-500 font-semibold text-xl mb-2">{message}</h2>
        ) : (
          <h2 className="text-red-500 font-semibold text-xl mb-2">{message}</h2>
        )}
        <p className="text-gray-400 mt-2">Redirecting to device connection page...</p>
      </div>
    </div>
  );
};
