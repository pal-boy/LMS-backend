class AppResponse extends Response{
    constructor(statusCode , data ,message ="success"){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }
}

export default AppResponse;