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
        <DialogDescription className="sr-only">
          选择支付宝或微信扫码赞赏作者。
        </DialogDescription>
        <Tabs value={method} onValueChange={(value) => setMethod(value as DonationMethod)}>
          <TabsList className="donation-method-tabs" variant="line">
            <TabsTrigger value="alipay">
              <WalletCards aria-hidden="true" />支付宝
            </TabsTrigger>
            <TabsTrigger value="wechat">
              <MessageCircle aria-hidden="true" />微信
            </TabsTrigger>
          </TabsList>
          <TabsContent value={method}>
            <div className="donation-method-panel">
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
