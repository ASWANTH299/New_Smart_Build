import React from "react";
import { PermissionDenied } from "../../components/ui/PermissionDenied.js";

export const PermissionDeniedPage: React.FC = () => {
  return (
    <div className="py-12 flex justify-center">
      <div className="w-full max-w-lg">
        <PermissionDenied />
      </div>
    </div>
  );
};

export default PermissionDeniedPage;
