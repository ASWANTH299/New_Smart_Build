import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./app/queryClient.js";
import { AuthProvider } from "./hooks/useAuth.js";
import { ProjectProvider } from "./hooks/useProjectContext.js";
import { ToastProvider } from "./hooks/useToast.js";
import { AppRoutes } from "./routes/AppRoutes.js";

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ProjectProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
