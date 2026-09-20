import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { fileUploadService } from '../../services/fileUploadService';
import { Button } from '../ui/button';

type Block = { id: string; type: string; html: string };

interface EmailBlockDesignerProps {
  value: string;
  onChange: (html: string) => void;
}

const id = () => crypto.randomUUID();
const assetUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = (apiClient.defaults.baseURL || window.location.origin).replace(/\/+$/, '').replace(/\/api$/i, '');
  return `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`;
};

const logoUrl = () => assetUrl('/images/logo/logo-light.png');
const heroUrl = () => assetUrl('/images/spirithub-cold-brew-oman-muscat.jpg');

const compactFooter = () => {
  const instagram = assetUrl('/images/email/social/instagram.png');
  const email = assetUrl('/images/email/social/email.png');
  const whatsapp = assetUrl('/images/email/social/whatsapp.png');
  return `<tr><td align="center" style="padding:24px;background:#000;color:#fff">
    <img src="${logoUrl()}" width="155" alt="SpiritHub Roastery" style="display:block;width:155px;max-width:100%;height:auto;margin:0 auto 18px;border:0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px">
      <tr><td align="center" style="padding:9px;border-top:1px solid #555;border-bottom:1px solid #555"><a href="https://spirithubcafe.com/om/products" style="color:#fff;font-size:11px;letter-spacing:2px;font-weight:bold;text-decoration:none">COFFEE</a></td><td width="12"></td><td align="center" style="padding:9px;border-top:1px solid #555;border-bottom:1px solid #555"><a href="https://spirithubcafe.com/om/shop" style="color:#fff;font-size:11px;letter-spacing:2px;font-weight:bold;text-decoration:none">BUNDLES</a></td></tr>
      <tr><td align="center" style="padding:9px;border-bottom:1px solid #555"><a href="https://spirithubcafe.com/om/products?category=specialty-coffee-capsules" style="color:#fff;font-size:11px;letter-spacing:2px;font-weight:bold;text-decoration:none">CAPSULES</a></td><td></td><td align="center" style="padding:9px;border-bottom:1px solid #555"><a href="https://spirithubcafe.com/om/wholesale" style="color:#fff;font-size:11px;letter-spacing:2px;font-weight:bold;text-decoration:none">WHOLESALE</a></td></tr>
      <tr><td colspan="3" align="center" style="padding:10px;border-bottom:1px solid #555"><a href="https://spirithubcafe.com/om/shop" style="color:#fff;font-size:11px;letter-spacing:2px;font-weight:bold;text-decoration:none">SHOP NOW</a></td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px auto 16px"><tr>
      <td style="padding:0 10px"><a href="https://instagram.com/spirithubcafe/"><img src="${instagram}" width="26" height="26" alt="Instagram" style="display:block;border:0"></a></td>
      <td style="padding:0 10px"><a href="mailto:info@spirithubcafe.com"><img src="${email}" width="26" height="26" alt="Email" style="display:block;border:0"></a></td>
      <td style="padding:0 10px"><a href="https://wa.me/96891900005"><img src="${whatsapp}" width="26" height="26" alt="WhatsApp" style="display:block;border:0"></a></td>
    </tr></table>
    <p style="margin:0 0 10px;font-size:11px">Sent with care from SpiritHub Roastery</p>
    <p style="margin:0;color:#aaa;font-size:10px;line-height:19px">SpiritHub Roastery, Muscat, Oman<br>No longer want these emails? <a href="{{unsubscribe_url}}" style="color:#fff;text-decoration:underline">Unsubscribe</a></p>
  </td></tr>`;
};

const starterBlocks = (): Block[] => [
  { id: id(), type: 'bar', html: '<tr><td align="center" style="padding:11px;background:#8b1e18;color:#fff;font-size:11px;letter-spacing:3px;font-weight:bold">FREE SHIPPING ON BUNDLES &amp; GIFTS</td></tr>' },
  { id: id(), type: 'header', html: `<tr><td align="center" style="padding:30px 24px 28px;background:#111"><img src="${logoUrl()}" width="205" alt="SpiritHub Roastery" style="display:block;width:205px;max-width:100%;height:auto;margin:0 auto 18px"><div style="color:#c7b299;font-size:11px;letter-spacing:5px">SPIRITHUB ROASTERY</div><h1 style="margin:13px 0;color:#fff;font-size:40px;line-height:46px">COLD BREW<br>SEASON IS HERE</h1><p style="margin:0;color:#fff;font-size:15px;line-height:24px">Smooth, refreshing, and crafted with specialty coffee from SpiritHub Roastery.</p></td></tr>` },
  { id: id(), type: 'image', html: `<tr><td style="padding:0;background:#111"><img src="${heroUrl()}" width="713" alt="SpiritHub Cold Brew" style="display:block;width:100%;max-width:713px;height:auto;border:0"></td></tr>` },
  { id: id(), type: 'text', html: '<tr><td align="center" style="padding:38px 45px 16px;background:#111;color:#fff"><div style="margin-bottom:15px;color:#c7b299;font-size:11px;letter-spacing:3px;font-weight:bold">COLD BREW &bull; LIMITED SUMMER RELEASE</div><p style="margin:0;font-size:15px;line-height:27px">This coffee is intentionally sourced and roasted to craft the perfect cold brew experience. Smooth, naturally sweet, and refreshing for warm summer days.</p></td></tr>' },
  { id: id(), type: 'button', html: '<tr><td align="center" style="padding:12px 24px 44px;background:#111"><a href="https://spirithubcafe.com/om/shop" style="display:inline-block;padding:15px 40px;background:#c7b299;color:#111;font-size:13px;letter-spacing:2px;font-weight:bold;text-decoration:none;border-radius:4px">EXPLORE COLD BREW</a></td></tr>' },
  { id: id(), type: 'footer', html: compactFooter() },
];

const blockHtml = (type: string) => ({
  heading: '<tr><td align="center" style="padding:28px;background:#fff"><h2 style="margin:0;font-size:30px;color:#111">YOUR HEADING</h2></td></tr>',
  text: '<tr><td style="padding:24px 40px;background:#fff;color:#374151;font-size:15px;line-height:25px"><p style="margin:0">Write your newsletter message here.</p></td></tr>',
  button: '<tr><td align="center" style="padding:24px;background:#fff"><a href="https://spirithubcafe.com/om/shop" style="display:inline-block;padding:14px 34px;background:#c7b299;color:#111;font-weight:bold;text-decoration:none;border-radius:4px">SHOP NOW</a></td></tr>',
  divider: '<tr><td style="padding:18px 40px;background:#fff"><div style="height:1px;background:#d1d5db"></div></td></tr>',
  spacer: '<tr><td height="36" style="height:36px;background:#fff;font-size:0">&nbsp;</td></tr>',
  footer: compactFooter(),
}[type] || '');

const exportHtml = (blocks: Block[]) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f3efe8;font-family:Arial,sans-serif}table{border-collapse:collapse}img{max-width:100%;height:auto}@media(max-width:735px){.email{width:100%!important}h1{font-size:30px!important;line-height:36px!important}}</style></head><body><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe8"><tr><td align="center"><table role="presentation" class="email" width="713" cellpadding="0" cellspacing="0" style="width:100%;max-width:713px">${blocks.map((block) => block.html).join('')}</table></td></tr></table></body></html>`;

export const EmailBlockDesigner: React.FC<EmailBlockDesignerProps> = ({ value, onChange }) => {
  const [blocks, setBlocks] = useState<Block[]>(() => value ? [{ id: id(), type: 'imported', html: `<tr><td>${value}</td></tr>` }] : starterBlocks());
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { onChange(exportHtml(blocks)); }, [blocks]);

  const update = (next: Block[]) => setBlocks(next);
  const add = (type: string) => update([...blocks, { id: id(), type, html: blockHtml(type) }]);
  const action = (blockId: string, kind: 'up' | 'down' | 'copy' | 'delete') => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index < 0) return;
    const next = [...blocks];
    if (kind === 'delete') next.splice(index, 1);
    if (kind === 'copy') next.splice(index + 1, 0, { ...next[index], id: id() });
    if (kind === 'up' && index > 0) [next[index - 1], next[index]] = [next[index], next[index - 1]];
    if (kind === 'down' && index < next.length - 1) [next[index], next[index + 1]] = [next[index + 1], next[index]];
    update(next);
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const result = await fileUploadService.uploadFile(file, 'newsletters', 'image', 'newsletter');
      if (!result.success || !result.fileUrl) throw new Error(result.message || 'Upload failed');
      const image: Block = { id: id(), type: 'image', html: `<tr><td style="padding:0;background:#fff"><img src="${assetUrl(result.fileUrl)}" width="713" alt="${file.name.replace(/"/g, '')}" style="display:block;width:100%;max-width:713px;height:auto;border:0"></td></tr>` };
      const index = blocks.findIndex((block) => block.id === selected);
      const next = [...blocks];
      next.splice(index >= 0 ? index + 1 : next.length, 0, image);
      setSelected(image.id);
      update(next);
    } finally { setUploading(false); }
  };

  return <div className="overflow-hidden rounded-lg border border-indigo-300 bg-slate-100">
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />
    <div className="grid lg:grid-cols-[180px_1fr]">
      <aside className="space-y-3 border-r bg-white p-3">
        <p className="font-semibold">Add block</p>
        <div className="grid grid-cols-2 gap-2">
          {['heading', 'text', 'button', 'divider', 'spacer', 'footer'].map((type) => <Button key={type} type="button" size="sm" variant="outline" onClick={() => add(type)} className="capitalize">{type}</Button>)}
        </div>
        <Button type="button" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}Photo</Button>
        <Button type="button" className="w-full" variant="secondary" onClick={() => update(starterBlocks())}><Plus className="mr-2 h-4 w-4" />SpiritHub template</Button>
        <p className="text-xs text-muted-foreground">Select a block, then add a photo to place it immediately below.</p>
      </aside>
      <div className="max-h-[720px] overflow-auto p-4" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const file = event.dataTransfer.files?.[0]; if (file) { event.preventDefault(); void upload(file); } }}>
        <div className="mx-auto max-w-[713px] bg-white shadow-xl">
          {blocks.map((block) => <section key={block.id} draggable onDragStart={() => setDragged(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => {
            if (!dragged || dragged === block.id) return;
            const next = [...blocks]; const from = next.findIndex((item) => item.id === dragged); const to = next.findIndex((item) => item.id === block.id); const [moving] = next.splice(from, 1); next.splice(to, 0, moving); update(next); setDragged(null);
          }} onClick={() => setSelected(block.id)} className={`group relative border-2 ${selected === block.id ? 'border-indigo-500' : 'border-transparent hover:border-indigo-300'}`}>
            <div className="absolute right-1 top-1 z-10 hidden gap-1 rounded bg-slate-900 p-1 group-hover:flex">
              <button type="button" onClick={() => action(block.id, 'up')} className="p-1 text-white"><ArrowUp className="h-3 w-3" /></button><button type="button" onClick={() => action(block.id, 'down')} className="p-1 text-white"><ArrowDown className="h-3 w-3" /></button><button type="button" onClick={() => action(block.id, 'copy')} className="p-1 text-white"><Copy className="h-3 w-3" /></button><button type="button" onClick={() => action(block.id, 'delete')} className="p-1 text-white"><Trash2 className="h-3 w-3" /></button>
            </div>
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" dangerouslySetInnerHTML={{ __html: block.html }} />
          </section>)}
        </div>
      </div>
    </div>
  </div>;
};
