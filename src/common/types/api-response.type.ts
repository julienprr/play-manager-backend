export type ApiResponse<K extends string, V> = {
  [P in K]: V;
};
