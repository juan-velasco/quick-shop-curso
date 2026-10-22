from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from alembic.config import Config
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from alembic import command
from app.core.config import get_settings
from app.db.seed import run_seed
from app.db.session import get_session_factory
from app.modules.auth.router import router as auth_router
from app.modules.products.router import router as products_router
from app.modules.users.router import router as users_router

API_PREFIX = "/api/v1"


def run_migrations() -> None:
    alembic_ini = Path(__file__).resolve().parents[1] / "alembic.ini"
    command.upgrade(Config(str(alembic_ini)), "head")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    run_migrations()
    with get_session_factory()() as db:
        run_seed(db, get_settings())
    yield


def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    messages = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error["loc"] if part not in ("body", "query"))
        message = error["msg"].removeprefix("Value error, ")
        messages.append(f"{location}: {message}" if location else message)
    return JSONResponse(status_code=422, content={"detail": "; ".join(messages)})


def create_app() -> FastAPI:
    app = FastAPI(title="QuickShop API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    for router in (auth_router, users_router, products_router):
        app.include_router(router, prefix=API_PREFIX)
    return app


app = create_app()
