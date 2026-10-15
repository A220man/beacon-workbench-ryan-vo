from fastapi import HTTPException, status


class BeaconException(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(BeaconException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(f"{resource} not found: {identifier}", "NOT_FOUND")


class ValidationError(BeaconException):
    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR")


class AuthorizationError(BeaconException):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, "AUTHORIZATION_ERROR")


class AuthenticationError(BeaconException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, "AUTHENTICATION_ERROR")


def beacon_exception_handler(exc: BeaconException) -> HTTPException:
    status_map = {
        "NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "VALIDATION_ERROR": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "AUTHORIZATION_ERROR": status.HTTP_403_FORBIDDEN,
        "AUTHENTICATION_ERROR": status.HTTP_401_UNAUTHORIZED,
    }
    return HTTPException(
        status_code=status_map.get(exc.code, status.HTTP_500_INTERNAL_SERVER_ERROR),
        detail={"code": exc.code, "message": exc.message},
    )