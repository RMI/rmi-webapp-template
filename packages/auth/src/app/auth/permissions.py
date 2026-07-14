"""Generic permission helpers for check_permissions and friends.

The template ships with an empty permission catalog. Add project-specific
permission constants here (e.g. ``WIDGET_READ = "widget:read"``) and re-export
them from ``app.auth.__init__``.
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Collection, Iterable
from typing import Literal, NoReturn, TypeAlias

from .errors import InsufficientPermissionsError

logger = logging.getLogger(__name__)

Permission: TypeAlias = str

ALL_PERMISSIONS: frozenset[Permission] = frozenset()


def missing_permissions(
    granted: Collection[str],
    required: Iterable[str],
) -> frozenset[str]:
    return frozenset(permission for permission in required if permission not in granted)


def has_all_permissions(
    granted: Collection[str],
    required: Iterable[str],
) -> bool:
    return not missing_permissions(granted, required)


def has_any_permission(
    granted: Collection[str],
    candidates: Iterable[str],
) -> bool:
    return any(permission in granted for permission in candidates)


def check_permissions(
    granted: Iterable[str],
    required: Iterable[str],
    check: Literal["all", "any"] = "all",
    exc_handler: Callable[[InsufficientPermissionsError], NoReturn] | None = None,
) -> None:
    """Verify that granted permissions satisfy required permissions.

    Args:
        granted: Permissions granted to the caller.
        required: Permissions required for the protected operation.
        check: Whether all required permissions or any required permission must be
            granted.
        exc_handler: Optional callback for mapping permission failures to a
            caller-specific exception. This callback should raise an exception.

    Raises:
        ValueError: If check is not "all" or "any".
        InsufficientPermissionsError: If the required permissions are not
            satisfied and exc_handler does not raise its own exception.
    """
    if check not in {"all", "any"}:
        msg = f"unsupported permission check mode: {check!r}"
        raise ValueError(msg)

    granted_set = frozenset(granted)
    required_set = frozenset(required)
    if not required_set:
        return None

    if check == "all":
        missing = required_set.difference(granted_set)
        if not missing:
            return None
    else:
        missing = required_set.difference(granted_set)
        if missing != required_set:
            return None

    exc = InsufficientPermissionsError(
        granted=granted_set,
        required=required_set,
        missing=missing,
    )
    if exc_handler is not None:
        exc_handler(exc)
    raise exc
