import { ContentType, ErrorStruct } from '../typings';

function errorResponse(error: ErrorStruct | ErrorStruct[]) {
  let errors: ErrorStruct[] = error as ErrorStruct[];
  if (!Array.isArray(error)) {
    errors = [error];
  }
  return {
    success: false,
    errors
  };
}

function successResponse(data: ContentType['data'], meta?: ContentType['meta']) {
  const content: ContentType = { data };
  if (meta) {
    content['meta'] = meta;
  }
  return {
    success: true,
    content
  };
}

export { successResponse, errorResponse };
