export type Success<T> = { error: false; data: T };
export type Failure = { error: true; message: string };
export type ApiResponse<TFieldName extends string, TData> =
  | ({ error: false } & Record<TFieldName, TData>)
  | { error: true; message: string };
