import { httpGet } from "@/_lib/server/query-api";
import { IUserOptions } from "./model";
import SettingsTabs from "@/_components/SettingsTabs";
import Main from "../_components/Main";
import Link from "next/link";
import { DescriptionItem } from "@/_components/DescriptionItem";
import Image from "next/image";

export default async function Page() {

    const data = await httpGet('options');
    const options = await data.json() as IUserOptions;
    const r = options.requisites;
    const inv = options.pricing.invoice;

    const hasLogo = r.logoBase64 && r.logoContentType;
    const addressParts = [r.address, r.address2].filter(Boolean).join(', ');
    const cityLine = [r.city, r.postcode, r.state].filter(Boolean).join(', ');
    const fullAddress = [addressParts, cityLine, r.country].filter(Boolean).join('\n');

    return (
        <Main header={<SettingsTabs />} narrow={true}>

            {/* Workshop Identity */}
            <div className="px-0">
                <h3 className="text-base/7 font-semibold text-foreground my-4">Workshop Identity</h3>
            </div>
            <div className="mt-4 border-t border-border">
                {hasLogo && (
                    <div className="py-4">
                        <Image
                            src={`data:${r.logoContentType};base64,${r.logoBase64}`}
                            alt={r.name}
                            width={160}
                            height={56}
                            className="max-h-14 w-auto object-contain"
                            unoptimized
                        />
                    </div>
                )}
                <dl className="divide-y divide-border">
                    <DescriptionItem label="Name" value={r.name} />
                    {r.tagline && <DescriptionItem label="Tagline" value={r.tagline} />}
                </dl>
            </div>

            {/* Contact & Address */}
            <div className="pt-8 px-0">
                <h3 className="text-base/7 font-semibold text-foreground">Contact &amp; Address</h3>
            </div>
            <div className="mt-4 border-t border-border">
                <dl className="divide-y divide-border">
                    <DescriptionItem label="Phone" value={r.phone} />
                    <DescriptionItem label="Email" value={r.email} />
                    {r.website && <DescriptionItem label="Website" value={r.website} />}
                    <DescriptionItem label="Address" className="whitespace-pre-line" value={fullAddress} />
                </dl>
            </div>

            {/* Legal & Tax */}
            <div className="pt-8 px-0">
                <h3 className="text-base/7 font-semibold text-foreground">Legal &amp; Tax</h3>
            </div>
            <div className="mt-4 border-t border-border">
                <dl className="divide-y divide-border">
                    <DescriptionItem label="SSM registration" value={r.regNr} />
                    <DescriptionItem label="SST registration" value={r.kmkr} />
                    <DescriptionItem label="Tax rate" value={inv.vatRate ? `${inv.vatRate}%` : ''} />
                    <DescriptionItem label="Currency" value={r.currency || 'MYR'} />
                </dl>
            </div>

            {/* Banking */}
            <div className="pt-8 px-0">
                <h3 className="text-base/7 font-semibold text-foreground">Banking</h3>
            </div>
            <div className="mt-4 border-t border-border">
                <dl className="divide-y divide-border">
                    <DescriptionItem label="Bank account" value={r.bankAccount} />
                </dl>
            </div>

            {/* Invoice Defaults */}
            <div className="pt-8 px-0">
                <h3 className="text-base/7 font-semibold text-foreground">Invoice Defaults</h3>
            </div>
            <div className="mt-4 border-t border-border">
                <dl className="divide-y divide-border">
                    <DescriptionItem label="Number prefix" value={inv.invoiceNumberPrefix || 'INV'} />
                    <DescriptionItem label="Payment due" value={`${inv.dueDays || 30} days`} />
                    <DescriptionItem label="Late fee" value={inv.surCharge} />
                    <DescriptionItem label="Signature lines" value={inv.signatureLine ? 'Yes' : 'No'} />
                    {inv.termsAndConditions && <DescriptionItem label="Terms & Conditions" className="whitespace-pre-line" value={inv.termsAndConditions} />}
                    {inv.disclaimer && <DescriptionItem label="Disclaimer" className="whitespace-pre-line" value={inv.disclaimer} />}
                </dl>
            </div>

            {/* Email Templates */}
            <div className="pt-8 px-0">
                <h3 className="text-base/7 font-semibold text-foreground">Email Templates</h3>
            </div>
            <div className="mt-4 border-t border-border">
                <dl className="divide-y divide-border">
                    <DescriptionItem label="Invoice email" className="whitespace-pre-line" value={inv.emailContent} />
                    <DescriptionItem label="Estimate email" className="whitespace-pre-line" value={options.pricing.estimate.emailContent} />
                </dl>
            </div>

            <div className="mt-6 flex items-center justify-end gap-x-6">
                <Link href="/home/settings/edit"
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary/100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Edit
                </Link>
            </div>
        </Main>
    )
}
