import logging

try:
    from pythonjsonlogger import jsonlogger  # type: ignore
except Exception:
    jsonlogger = None


def setup_logging() -> None:
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler()
    if jsonlogger is not None:
        formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    else:
        # Fallback simple formatter if pythonjsonlogger is not installed.
        formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
