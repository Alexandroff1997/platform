export interface RpcErrorResponse {
  error: {
    statusCode: number;
    message: string | string[];
  };
}
