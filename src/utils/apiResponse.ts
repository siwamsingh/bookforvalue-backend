class ApiResponse {

  statusCode: number;
  data: any;
  message: string;
  success: boolean;

  constructor(
    statusCode: number,
    data: any,
    message: string = "Success",
  ) {
    this.data = data
    this.statusCode = statusCode
    this.message = message
    this.success = statusCode < 400
  }
}

export { ApiResponse }