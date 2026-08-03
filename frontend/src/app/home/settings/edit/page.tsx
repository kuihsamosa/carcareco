'use server'

import SettingsTabs from '@/_components/SettingsTabs'
import Main from '../../_components/Main'
import { httpGet } from '@/_lib/server/query-api';
import { IUserOptions } from '../model';
import FormInput from '@/_components/FormInput';
import FormTextArea from '@/_components/FormTextArea';
import FormSwitch from '@/_components/FormSwitch';
import FormLabel from '@/_components/FormLabel';
import Select from '@/_components/Select';
import SubmitButton from '@/_components/SubmitButton';
import { createOrUpdate } from '../createOrUpdate';
import LogoUpload from '../_components/LogoUpload';
import SignatureUpload from '../_components/SignatureUpload';

export default async function Page() {

    const data = await httpGet('options');
    const options = await data.json() as IUserOptions;

    const r = options.requisites;
    const inv = options.pricing.invoice;

    return (
        <Main header={<SettingsTabs />} narrow={true}>
            <form action={createOrUpdate}>
                <div className="space-y-10">

                    {/* ── Workshop Identity ── */}
                    <section className="border-b border-border pb-10">
                        <h2 className="text-base font-semibold text-foreground">Workshop Identity</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Your logo and name appear on invoices and estimates.</p>

                        <div className="mt-6 space-y-6">
                            <div>
                                <FormLabel name="logo" label="Logo" />
                                <div className="mt-2">
                                    <LogoUpload initialBase64={r.logoBase64} initialContentType={r.logoContentType} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                                <div className="sm:col-span-4">
                                    <FormInput name="name" label="Workshop name" defaultValue={r.name} required />
                                </div>
                                <div className="sm:col-span-4">
                                    <FormInput name="tagline" label="Tagline" defaultValue={r.tagline} placeholder="e.g. Your trusted car care partner" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Contact & Address ── */}
                    <section className="border-b border-border pb-10">
                        <h2 className="text-base font-semibold text-foreground">Contact &amp; Address</h2>

                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <FormInput name="phone" label="Phone" defaultValue={r.phone} type="tel" inputMode="tel" />
                            </div>
                            <div className="sm:col-span-3">
                                <FormInput name="email" label="Email" defaultValue={r.email} type="email" inputMode="email" />
                            </div>
                            <div className="sm:col-span-3">
                                <FormInput name="website" label="Website" defaultValue={r.website} placeholder="https://" inputMode="url" />
                            </div>
                            <div className="sm:col-span-6">
                                <FormInput name="address" label="Address line 1" defaultValue={r.address} />
                            </div>
                            <div className="sm:col-span-6">
                                <FormInput name="address2" label="Address line 2" defaultValue={r.address2} />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="city" label="City" defaultValue={r.city} />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="postcode" label="Postcode" defaultValue={r.postcode} />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="state" label="State" defaultValue={r.state} />
                            </div>
                            <div className="sm:col-span-3">
                                <FormInput name="country" label="Country" defaultValue={r.country} placeholder="Malaysia" />
                            </div>
                        </div>
                    </section>

                    {/* ── Legal & Tax ── */}
                    <section className="border-b border-border pb-10">
                        <h2 className="text-base font-semibold text-foreground">Legal &amp; Tax</h2>

                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <FormInput name="regNr" label="SSM registration no." defaultValue={r.regNr} />
                            </div>
                            <div className="sm:col-span-3">
                                <FormInput name="kmkr" label="SST registration no." defaultValue={r.kmkr} />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="vatRate" label="Tax rate (%)" defaultValue={inv.vatRate} type="number" inputMode="numeric" />
                            </div>
                            <div className="sm:col-span-2">
                                <FormLabel name="currency" label="Currency" />
                                <div className="mt-2 grid grid-cols-1">
                                    <Select name="currency" defaultValue={r.currency || 'MYR'}>
                                        <option value="MYR">MYR — Ringgit</option>
                                        <option value="USD">USD — US Dollar</option>
                                        <option value="EUR">EUR — Euro</option>
                                        <option value="SGD">SGD — Singapore Dollar</option>
                                        <option value="GBP">GBP — Pound Sterling</option>
                                        <option value="IDR">IDR — Rupiah</option>
                                        <option value="THB">THB — Thai Baht</option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Banking ── */}
                    <section className="border-b border-border pb-10">
                        <h2 className="text-base font-semibold text-foreground">Banking</h2>

                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <FormInput name="bankAccount" label="Bank account" defaultValue={r.bankAccount} placeholder="e.g. Maybank 5123-4567-8901" />
                            </div>
                        </div>
                    </section>

                    {/* ── Invoice Defaults ── */}
                    <section className="border-b border-border pb-10">
                        <h2 className="text-base font-semibold text-foreground">Invoice Defaults</h2>

                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-2">
                                <FormInput name="invoiceNumberPrefix" label="Number prefix" defaultValue={inv.invoiceNumberPrefix || 'INV'} />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="dueDays" label="Payment due (days)" defaultValue={inv.dueDays || 30} type="number" inputMode="numeric" />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="surCharge" label="Late fee" defaultValue={inv.surCharge} placeholder="e.g. 1.5% per month" />
                            </div>

                            <div className="sm:col-span-2">
                                <FormLabel name="signatureLine" label="Signature lines" />
                                <div className="mt-3">
                                    <FormSwitch name="signatureLine" defaultChecked={inv.signatureLine} />
                                </div>
                            </div>

                            <div className="sm:col-span-full">
                                <SignatureUpload initialBase64={inv.workshopSignatureBase64} label="Workshop signature stamp" fieldName="workshopSignatureBase64" />
                            </div>

                            <div className="sm:col-span-full">
                                <FormTextArea name="termsAndConditions" label="Terms &amp; Conditions" defaultValue={inv.termsAndConditions} rows={4} placeholder="Payment terms, warranty, liability..." />
                            </div>
                            <div className="sm:col-span-full">
                                <FormTextArea name="disclaimer" label="Disclaimer" defaultValue={inv.disclaimer} rows={2} />
                            </div>
                        </div>
                    </section>

                    {/* ── Email Templates ── */}
                    <section className="pb-10">
                        <h2 className="text-base font-semibold text-foreground">Email Templates</h2>

                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-full">
                                <FormTextArea name="emailContent" rows={6} label="Invoice email body" defaultValue={inv.emailContent} />
                            </div>
                            <div className="sm:col-span-full">
                                <FormTextArea name="estimateEmailContent" rows={6} label="Estimate email body" defaultValue={options.pricing.estimate.emailContent} />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="sticky bottom-0 -mx-4 border-t border-border bg-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                    <div className="flex items-center justify-end gap-x-4">
                        <a href="/home/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</a>
                        <SubmitButton>Save settings</SubmitButton>
                    </div>
                </div>
            </form>
        </Main>
    )
}
