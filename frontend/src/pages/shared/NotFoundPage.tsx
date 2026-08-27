import React from "react";
import { Link } from "react-router-dom";
import { HardHat, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
        <HardHat className="w-12 h-12 text-brand-600" />
      </div>
      <div className="space-y-1 max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 font-mono">404</h1>
        <h2 className="text-lg font-semibold text-slate-800">Page Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          The requested construction operations page does not exist or has been relocated.
        </p>
      </div>
      <div className="pt-2">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Operations Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
