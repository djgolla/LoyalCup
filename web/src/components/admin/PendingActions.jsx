// Pending actions widget for admin dashboard

import { AlertCircle, Store, Flag, MessageSquare } from "lucide-react";

export default function PendingActions({ actions }) {
  return (
    <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        Pending Actions
      </h3>

      <div className="space-y-3">
        {actions.shopsAwaitingApproval > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-amber-500" />
              <span className="text-gray-300">Shops awaiting approval</span>
            </div>
            <span className="font-semibold text-amber-500">{actions.shopsAwaitingApproval}</span>
          </div>
        )}

        {actions.reportedReviews > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <Flag className="w-5 h-5 text-red-500" />
              <span className="text-gray-300">Reported reviews</span>
            </div>
            <span className="font-semibold text-red-500">{actions.reportedReviews}</span>
          </div>
        )}

        {actions.supportTickets > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <span className="text-gray-300">Support tickets</span>
            </div>
            <span className="font-semibold text-orange-500">{actions.supportTickets}</span>
          </div>
        )}

        {actions.shopsAwaitingApproval === 0 && 
         actions.reportedReviews === 0 && 
         actions.supportTickets === 0 && (
          <p className="text-gray-500 text-center py-4">No pending actions</p>
        )}
      </div>
    </div>
  );
}
