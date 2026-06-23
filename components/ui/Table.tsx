import React, { ReactNode } from "react";
import clsx from "clsx";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="table-wrapper">
      <table className={clsx("table", className)}>{children}</table>
    </div>
  );
}

export function Thead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

export function Tbody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={className}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}
