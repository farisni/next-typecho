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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DonationMethod = "alipay" | "wechat";

export function DonationDialog() {
  const [method, setMethod] = useState<DonationMethod>("alipay");

  const title = method === "alipay" ? "支付宝二维码" : "微信二维码";
  const Icon = method === "alipay" ? WalletCards : MessageCircle;

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
        <DialogDescription className="donation-dialog-description">
          选择支付方式，扫码支持作者
        </DialogDescription>
        <Tabs
          className="donation-tabs"
          data-method={method}
          value={method}
          onValueChange={(value) => setMethod(value as DonationMethod)}
        >
          <TabsList className="donation-method-tabs">
            <TabsTrigger value="alipay" data-method-option="alipay">
              <span className="donation-method-icon" aria-hidden="true">
                <WalletCards />
              </span>
              <span>支付宝</span>
            </TabsTrigger>
            <TabsTrigger value="wechat" data-method-option="wechat">
              <span className="donation-method-icon" aria-hidden="true">
                <MessageCircle />
              </span>
              <span>微信</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value={method}>
            <div className="donation-method-panel" data-method={method}>
              <div className="donation-qr-placeholder">
                <div className="donation-qr-placeholder-mark" aria-hidden="true">
                  <Icon aria-hidden="true" />
                </div>
                <strong>{title}</strong>
                <span>请在站点配置真实收款二维码</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
