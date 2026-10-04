"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { OCTOBER_BRANCHES, octoberOffer as offer } from "@/config/octoberOffer";
import styles from "./experience.module.css";

const STEPS = ["زور أقرب فرع CUT", "فعّل العرض وادفع قيمته في الفرع", "استخدم خدماتك خلال شهر أكتوبر"] as const;

export const Conversion = forwardRef<HTMLElement, { reduced: boolean }>(function Conversion({ reduced }, ref) {
  const reveal = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.5 },
          transition: { duration: 0.7, delay },
        };

  return (
    <section ref={ref} id="october-offer" className={styles.offer} aria-labelledby="october-how" tabIndex={-1}>
      <div className={styles.how}>
        <div className={styles.recap}>
          <p className={styles.eyebrow}>{offer.campaignName}</p>
          <p className={styles.recapPrice}>
            <span className={styles.recapLabel}>أربع خدمات</span>
            <span className={styles.recapValues}>
              <del>
                <span dir="ltr">{offer.originalPrice}</span> {offer.currency}
              </del>
              <span className={styles.recapArrow} aria-hidden="true">
                ←
              </span>
              <strong>
                <span dir="ltr">{offer.price}</span> {offer.currency}
              </strong>
            </span>
          </p>
        </div>

        <h2 id="october-how" className={styles.howTitle}>
          عرض أكتوبر
        </h2>
        <p className={styles.howLead}>٤ خدمات. تجربة كاملة.</p>
        <p className={styles.howWindow}>
          متاح من <time dateTime={offer.startsOn}>{offer.startsLabel}</time> حتى{" "}
          <time dateTime={offer.endsOn}>{offer.endsLabel}</time>
        </p>

        <ol className={styles.steps} data-offer-block="steps">
          {STEPS.map((text, index) => (
            <motion.li key={text} {...reveal(index * 0.12)}>
              <span className={styles.stepNumber} dir="ltr">{`0${index + 1}`}</span>
              <span>{text}</span>
            </motion.li>
          ))}
        </ol>

        <motion.div className={styles.howNote} data-offer-block="note" {...reveal(0.2)}>
          <p className={styles.howNoteLead}>مش لازم تستخدم الأربع خدمات في نفس الزيارة.</p>
          <p>بمجرد تفعيل العرض في الفرع، تقدر تستفيد من خدماتك خلال أكتوبر وفق شروط العرض.</p>
        </motion.div>

        <p className={styles.howFine}>لا يوجد دفع أو شراء للعرض أونلاين.</p>
      </div>

      <div className={styles.branches} data-offer-block="branches">
        <h2 id="october-branches" className={styles.branchesTitle}>
          جاهز تبدأ التجربة؟
        </h2>

        <ul className={styles.branchList}>
          {OCTOBER_BRANCHES.map((branch) => (
            <li key={branch.code} className={styles.branch}>
              <p className={styles.branchTag}>{branch.tag}</p>
              <h3 className={styles.branchName}>{branch.name}</h3>
              <p className={styles.branchAddress}>{branch.address}</p>
              <div className={styles.branchActions}>
                <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.textButton}>
                  افتح اللوكيشن
                </a>
                <Link href={branch.bookHref} className={styles.textButton}>
                  احجز في الفرع ده
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.finalActions}>
          <Link href={offer.bookHref} className={styles.primaryButton}>
            احجز الباكدج
          </Link>
          <a href={offer.whatsappHref} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>
            اسألنا عن عرض أكتوبر
          </a>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>الدفع وتفعيل العرض داخل فروع CUT فقط. تطبق شروط العرض.</p>
        <p dir="ltr">© {new Date().getFullYear()} CUT Salon</p>
      </footer>
    </section>
  );
});
