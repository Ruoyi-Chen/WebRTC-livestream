import dayjs from "dayjs";

const DEFAULT_FORMAT = "YYYY-MM-DD HH:mm";

export const formatTimeString = (
  time: string | number,
  format?: string
): string => {
  return dayjs(time).format(format ?? DEFAULT_FORMAT);
};
