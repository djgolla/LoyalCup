from typing import Dict
from .base import POSAdapter
from app.integrations.square.adapter import SquareAdapter
from app.integrations.toast.adapter import ToastAdapter
from app.integrations.clover.adapter import CloverAdapter

def get_pos_adapters() -> Dict[str, POSAdapter]:
    return {
        "square": SquareAdapter(),
        "toast": ToastAdapter(),
        "clover": CloverAdapter(),
    }