from pydantic import BaseModel


class RegistrationRequest(BaseModel):
    email: str
    passphrase: str


class RegistrationResponse(BaseModel):
    success: bool
    message: str
    user_id: str


class AuthenticationRequest(BaseModel):
    email: str


class AuthenticationResponse(BaseModel):
    success: bool
    message: str
    speaker_verified: bool
    keyword_verified: bool
    confidence_score: float
