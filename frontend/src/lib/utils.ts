import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const period = (start: string, end: string) =>
  start || end
    ? [
        start ? start.replaceAll("-", ".") : "시작일 미등록",
        end ? end.replaceAll("-", ".") : "진행 중",
      ].join(" — ")
    : "기간 미등록";
export const initials = (name: string) => name.slice(0, 1);
