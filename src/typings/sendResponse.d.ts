type ResponseInfo<T = string> = Record<string, T>;

interface SuccessfulReq<T = string> {
  errors: [];
  results: ResponseInfo<T>[];
}

interface ErrorInfo {
  code: number;
  name: string;
  message?: string;
}

interface FailedReq {
  errors: ErrorInfo[];
  results: [];
}
