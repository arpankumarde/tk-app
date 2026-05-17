import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

interface EnrollmentContextType {
  enrolledTestIds: Set<number>;
  markTestEnrolled: (id: number) => void;
}

const EnrollmentContext = createContext<EnrollmentContextType | undefined>(
  undefined,
);

export const EnrollmentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [enrolledTestIds, setEnrolledTestIds] = useState<Set<number>>(
    () => new Set(),
  );

  const markTestEnrolled = useCallback((id: number) => {
    setEnrolledTestIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return (
    <EnrollmentContext.Provider value={{ enrolledTestIds, markTestEnrolled }}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export const useEnrollmentContext = () => {
  const context = useContext(EnrollmentContext);
  if (context === undefined) {
    throw new Error(
      "useEnrollmentContext must be used within an EnrollmentProvider",
    );
  }
  return context;
};
