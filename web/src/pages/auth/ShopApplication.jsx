import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import supabase from "../../lib/supabase";

export default function ShopApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    businessLicense: "",
    website: "",
    whyJoin: "",
    agreeToTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to apply");
        navigate("/login?redirect=/shop-application");
        return;
      }

      // Call the new apply endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/shops/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: formData.businessName,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          phone: formData.phone,
          business_license: formData.businessLicense,
          website: formData.website,
          why_join: formData.whyJoin
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to submit application");
      }

      // Update user metadata in Supabase auth
      await supabase.auth.updateUser({
        data: { role: "shop_owner" }
      });

      toast.success(result.message || "Application approved! Welcome to LoyalCup.");
      
      // Redirect to shop owner dashboard
      setTimeout(() => {
        navigate("/shop-owner");
      }, 1000);
    } catch (error) {
      console.error("Failed to submit application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Apply to Join LoyalCup
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Fill out the form below to list your coffee shop on our platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                placeholder="The Coffee Corner"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition resize-none"
                placeholder="Tell us about your coffee shop..."
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                placeholder="123 Main Street"
                required
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                  placeholder="San Francisco"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                  placeholder="CA"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                  placeholder="94102"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                placeholder="(555) 123-4567"
                required
              />
            </div>

            {/* Business License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business License Number
              </label>
              <input
                type="text"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                placeholder="Optional"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition"
                placeholder="https://yourshop.com"
              />
            </div>

            {/* Why Join */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Why do you want to join LoyalCup?
              </label>
              <textarea
                name="whyJoin"
                value={formData.whyJoin}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 transition resize-none"
                placeholder="Tell us why you'd like to be part of LoyalCup..."
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-amber-700 focus:ring-amber-700 rounded"
                required
              />
              <label className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <a href="/terms" className="text-amber-700 hover:underline">
                  terms and conditions
                </a>{" "}
                and understand that my application will be reviewed by the LoyalCup team
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-700 text-white py-4 rounded-lg hover:bg-amber-800 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
