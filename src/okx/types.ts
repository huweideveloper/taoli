export interface OkxEnvelope<T> {
  code: string;
  msg: string;
  data: T;
}
