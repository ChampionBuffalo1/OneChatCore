import Logger from './Logger';
// V is the type to response entry <string, V>
// M is just used for typings
const sendResponse = <V = string, M = null>(
  results: (M extends null ? ResponseInfo<V> : ResponseInfo<V>[]) | ErrorInfo,
  isError = false
): SuccessfulReq | FailedReq => {
  // TODO: Write a better log message
  if (!isError && !Array.isArray(results) && (results as ErrorInfo).code) Logger.debug('The message could be an error');

  if (isError) return { errors: [results], results: [] } as FailedReq;
  return {
    errors: [],
    results: Array.isArray(results) ? results : [results]
  } as SuccessfulReq;
};

export { sendResponse };
