"use client";

import { useState } from "react";
import { MessageCircle, WalletCards, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DonationMethod = "alipay" | "wechat";

export function DonationDialog() {
  const [method, setMethod] = useState<DonationMethod>("alipay");

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className="post-support-donate" type="button" />
        }
      >
        <WalletCards aria-hidden="true" />
        打赏
      </DialogTrigger>
      <DialogContent className="donation-dialog" showCloseButton={false}>
        <div className="donation-dialog-header">
          <DialogTitle>赞赏作者</DialogTitle>
          <DialogClose
            render={
              <button className="donation-dialog-close" type="button" aria-label="关闭赞赏弹窗" />
            }
          >
            <X aria-hidden="true" />
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          选择支付宝或微信扫码赞赏作者。
        </DialogDescription>
        <div className="donation-method-tabs" role="tablist" aria-label="赞赏方式">
          <button
            className={method === "alipay" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={method === "alipay"}
            onClick={() => setMethod("alipay")}
          >
            <WalletCards aria-hidden="true" />支付宝
          </button>
          <button
            className={method === "wechat" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={method === "wechat"}
            onClick={() => setMethod("wechat")}
          >
            <MessageCircle aria-hidden="true" />微信
          </button>
        </div>
        <div className="donation-method-panel" role="tabpanel">
          <div className="donation-qr-placeholder">
            <div className="donation-qr-placeholder-mark" aria-hidden="true">
              {method === "alipay" ? <WalletCards /> : <MessageCircle />}
            </div>
            <strong>{method === "alipay" ? "支付宝二维码" : "微信二维码"}</strong>
            <span>请在站点配置真实收款二维码</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
