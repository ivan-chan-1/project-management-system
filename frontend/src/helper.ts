import { format } from "date-fns";

export const formatDate = (iso: string) => {
  const date = new Date(iso);
  return format(date, "dd/MM/yyyy");
};

export const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return format(date, "dd/MM/yyyy hh:mm a");
};
