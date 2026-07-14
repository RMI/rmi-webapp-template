from fastapi import APIRouter

from app.api.auth import Claims
from app.api.entities import AuthMeView, TokenClaimsView

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthMeView)
async def get_auth_me(*, claims: Claims) -> AuthMeView:
    return AuthMeView(
        claims=TokenClaimsView(
            sub=claims.sub,
            email=claims.email,
            name=claims.name,
            permissions=sorted(claims.permissions),
            raw=claims.raw,
        ),
    )
