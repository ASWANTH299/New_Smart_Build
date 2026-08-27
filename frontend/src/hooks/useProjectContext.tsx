import React, { createContext, useContext, useState, ReactNode } from "react";
import { ProjectContextType } from "../types/index.js";

interface ProjectContextState {
  activeProject: ProjectContextType | null;
  setActiveProject: (project: ProjectContextType | null) => void;
  availableProjects: ProjectContextType[];
  setAvailableProjects: (projects: ProjectContextType[]) => void;
}

const ProjectContext = createContext<ProjectContextState | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProject] = useState<ProjectContextType | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectContextType[]>([]);

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        setActiveProject,
        availableProjects,
        setAvailableProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextState => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};

export default useProjectContext;
