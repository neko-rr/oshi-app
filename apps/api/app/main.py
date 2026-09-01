from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.settings import get_settings
from app.routers.assist import router as assist_router
from app.routers.health import router as health_router
from app.routers.health import router_me, unauthorized_payload
from app.routers.photos import router as photos_router
from app.routers.products import router as products_router
from app.routers.stats import router as stats_router
from app.routers.tags import router as tags_router
from app.routers.theme_settings import router as theme_settings_router


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(title="oshi-app API", version="0.1.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(health_router)
    application.include_router(router_me)
    application.include_router(products_router)
    application.include_router(photos_router)
    application.include_router(assist_router)
    application.include_router(tags_router)
    application.include_router(theme_settings_router)
    application.include_router(stats_router)

    @application.exception_handler(HTTPException)
    async def http_exception_handler(
        _request: Request, exc: HTTPException
    ) -> JSONResponse:
        if exc.status_code == 401:
            return unauthorized_payload(exc.detail)
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": exc.detail},
            )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(exc.detail),
                }
            },
        )

    @application.exception_handler(RequestValidationError)
    async def validation_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "入力が不正です",
                    "details": exc.errors(),
                }
            },
        )

    return application


app = create_app()
