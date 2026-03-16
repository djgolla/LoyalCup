import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

function Alert({ type = "info", message }) {
  // type: info, error, success
  let style =
    type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-amber-50 border-amber-200 text-amber-800";
  let icon =
    type === "error" ? <XCircle className="h-5 w-5 mr-2" />
    : type === "success" ? <CheckCircle2 className="h-5 w-5 mr-2" />
    : <AlertTriangle className="h-5 w-5 mr-2" />;

  return (
    <div className={`flex items-center border px-4 py-2 rounded-lg mb-4 ${style}`}>
      {icon}
      <div className="text-sm">{message}</div>
    </div>
  );
}

export default function ConnectSquarePage() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [locations, setLocations] = useState([]);
  const [shopId, setShopId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/pos/status?provider=square");
      const data = await res.json();
      setStatus(data.status);
      if (data.location_id) setLocations([{ id: data.location_id, name: "This Location" }]);
      if (data.shop_id) setShopId(data.shop_id);
      if (data.merchant_id) setMerchantId(data.merchant_id);
    } catch {
      setError("Could not connect to backend. Please try again or contact support.");
      setStatus("error");
    }
    setLoading(false);
  }

  useEffect(() => { checkStatus(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "choose_location") {
      try {
        const locsRaw = params.get("locations");
        if (locsRaw) {
          const locs = JSON.parse(decodeURIComponent(atob(locsRaw)));
          setLocations(locs);
        }
        setShopId(params.get("shop_id"));
        setMerchantId(params.get("merchant_id"));
        setStatus("choose_location");
      } catch {
        setError("Failed to parse locations from Square.");
      }
    }
  }, []);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/pos/connect?provider=square", { method: "POST" });
      const data = await res.json();
      if (!data.authorization_url) throw new Error("No auth url received");
      window.location.href = data.authorization_url;
    } catch (err) {
      setError("Could not begin Square connect flow. Try again or contact support.");
      setLoading(false);
    }
  }

  async function handleLocationPick(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const locationId = e.target.location_id.value;
    try {
      const res = await fetch("/api/v1/pos/square/set-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_id: shopId, location_id: locationId }),
      });
      if (!res.ok) throw new Error("Failed to set location");
      setStatus("connected");
      setLocations([]);
      setSuccess("Square location linked successfully!");
    } catch (err) {
      setError("Error saving your Square location. Try again or contact support.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Connect Your Square POS</h1>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {status === "connected" && (
        <div className={`flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 text-green-900 px-4 py-2 mb-6`}>
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <span className="font-medium">Square Connected!</span>
            {locations.length ? (
              <span className="ml-2 text-xs text-green-700">Location: {locations[0].name}</span>
            ) : null}
            <span className="ml-2 text-xs text-green-700">Merchant ID: {merchantId}</span>
          </div>
        </div>
      )}

      {status === "choose_location" ? (
        <form onSubmit={handleLocationPick} className="mb-8">
          <label className="block font-medium text-sm text-gray-700 mb-2">
            Select Square Location:
            <select
              name="location_id"
              required
              className="mt-2 block w-full rounded-md border-gray-300 focus:border-amber-500 focus:ring focus:ring-amber-500 focus:ring-opacity-50 py-2 px-3"
            >
              <option value="">-- Select --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name || l.id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300"
          >
            {loading ? "Saving..." : "Save Location"}
          </button>
        </form>
      ) : status !== "connected" ? (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="mt-3 inline-flex items-center px-8 py-2 bg-green-100 text-green-900 border border-green-200 rounded-lg font-medium hover:bg-green-200 transition disabled:bg-gray-200"
        >
          {loading ? "Connecting..." : "Connect Square"}
        </button>
      ) : null}

      <div className="mt-10 text-sm text-gray-600 dark:text-gray-400">
        Haven&apos;t registered with Square?{" "}
        <a
          href="https://squareup.com/us/en"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-700 underline hover:text-amber-600"
        >
          Sign up here
        </a>
        .
      </div>
    </div>
  );
}