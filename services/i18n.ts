// i18n Service
import { useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

const translations = {
    ar: {
        title: 'ميزان',
        subtitle: 'تحكم بمستقبلك المالي بذكاء',
        login: 'تسجيل دخول',
        register: 'حساب جديد',
        logout: 'خروج',
        settings: 'الإعدادات',
        dashboard: 'لوحة التحكم',
        balance: 'الرصيد الحالي',
        income: 'إجمالي الدخل',
        expense: 'إجمالي المصاريف',
        recentTransactions: 'العمليات الأخيرة',
        addTransaction: 'إضافة عملية',
        smartAnalysis: 'التحليل الذكي',
        startAnalysis: 'بدء التحليل',
        analyzing: 'جاري التحليل...',
        noTransactions: 'لا توجد عمليات مضافة بعد.',
        date: 'التاريخ',
        operation: 'العملية',
        category: 'الفئة',
        amount: 'المبلغ',
        verifyEmail: 'يرجى التحقق من بريدك الإلكتروني لتأمين حسابك بالكامل.',
        aiReport: 'تقرير ميزان الذكي',
        closeReport: 'إغلاق التقرير',
        save: 'حفظ',
        cancel: 'إلغاء',
        type: 'نوع العملية',
        incomeHeader: 'دخل',
        expenseHeader: 'مصروف',
        titleLabel: 'العنوان',
        placeholderTitle: 'مثلاً: إيجار الشقة',
        monthlySummary: 'الملخص الشهري',
        expenseDistribution: 'توزيع المصاريف حسب الفئة',
        exportCSV: 'تصدير CSV',
        exportPDF: 'تصدير PDF',
        welcome: 'أهلاً، ',
        categoriesTab: 'التصنيفات',
        securityTab: 'الأمان',
        customCategories: 'تصنيفات مخصصة',
        categoriesDesc: 'أضف تصنيفاتك الخاصة لتنظيم عملياتك المالية بشكل أفضل.',
        categoryName: 'اسم التصنيف',
        noCategories: 'لا يوجد تصنيفات مخصصة بعد.',
        securitySettings: 'إعدادات الأمان',
        securityDesc: 'قم بتحديث كلمة مرورك وتأمين حسابك.',
        verified: 'الحساب موثق',
        unverified: 'الحساب غير موثق',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        updatePassword: 'تحديث كلمة المرور',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        passwordUpdated: 'تم تحديث كلمة المرور بنجاح',
        passwordUpdateFailed: 'فشل تحديث كلمة المرور',
        close: 'إغلاق'
    },
    en: {
        title: 'Mizan',
        subtitle: 'Control your financial future wisely',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        settings: 'Settings',
        dashboard: 'Dashboard',
        balance: 'Current Balance',
        income: 'Total Income',
        expense: 'Total Expenses',
        recentTransactions: 'Recent Transactions',
        addTransaction: 'Add Transaction',
        smartAnalysis: 'Smart Analysis',
        startAnalysis: 'Start Analysis',
        analyzing: 'Analyzing...',
        noTransactions: 'No transactions added yet.',
        date: 'Date',
        operation: 'Transaction',
        category: 'Category',
        amount: 'Amount',
        verifyEmail: 'Please verify your email to fully secure your account.',
        aiReport: 'Mizan AI Report',
        closeReport: 'Close Report',
        save: 'Save',
        cancel: 'Cancel',
        type: 'Transaction Type',
        incomeHeader: 'Income',
        expenseHeader: 'Expense',
        titleLabel: 'Title',
        placeholderTitle: 'e.g., Rent',
        monthlySummary: 'Monthly Summary',
        expenseDistribution: 'Expense Distribution',
        exportCSV: 'Export CSV',
        exportPDF: 'Export PDF',
        welcome: 'Welcome, ',
        categoriesTab: 'Categories',
        securityTab: 'Security',
        customCategories: 'Custom Categories',
        categoriesDesc: 'Add your own categories to better organize your finances.',
        categoryName: 'Category Name',
        noCategories: 'No custom categories yet.',
        securitySettings: 'Security Settings',
        securityDesc: 'Update your password and secure your account.',
        verified: 'Account Verified',
        unverified: 'Account Unverified',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        updatePassword: 'Update Password',
        passwordMismatch: 'Passwords do not match',
        passwordUpdated: 'Password updated successfully',
        passwordUpdateFailed: 'Failed to update password',
        close: 'Close'
    }
};

export const useTranslation = () => {
    const [lang, setLang] = useState<Language>((localStorage.getItem('mizan_lang') as Language) || 'ar');

    const t = (key: keyof typeof translations.ar) => {
        return translations[lang][key] || key;
    };

    const toggleLanguage = () => {
        const newLang = lang === 'ar' ? 'en' : 'ar';
        setLang(newLang);
        localStorage.setItem('mizan_lang', newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLang;
    };

    useEffect(() => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

    return { t, lang, toggleLanguage };
};
