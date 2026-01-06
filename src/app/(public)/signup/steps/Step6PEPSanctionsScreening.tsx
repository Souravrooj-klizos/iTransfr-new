import { cn } from '@/lib/utils';
import { PEP_QUESTIONS, FUND_ORIGIN_QUESTION } from '@/lib/constants/pep';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';

interface Step6Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export function Step6PEPSanctionsScreening({ formData = {}, onChange, errors = {} }: Step6Props) {
  const pepResponses = formData.pepResponses || {};

  const updatePepResponse = (questionId: string, value: boolean) => {
    onChange?.('pepResponses', { ...pepResponses, [questionId]: value });
  };

  const answeredCount = PEP_QUESTIONS.filter(q => pepResponses[q.id] !== undefined).length;
  const allPepAnswered = answeredCount === PEP_QUESTIONS.length;

  // Check if any PEP/sanctions question is answered "Yes"
  const hasPepFlag = PEP_QUESTIONS.some(q => pepResponses[q.id] === true);

  // Fund origin question is required only when there's a PEP flag
  const fundOriginAnswered = pepResponses[FUND_ORIGIN_QUESTION.id] !== undefined;
  const allAnswered = allPepAnswered && (!hasPepFlag || fundOriginAnswered);

  const totalQuestions = hasPepFlag ? PEP_QUESTIONS.length + 1 : PEP_QUESTIONS.length;
  const displayAnsweredCount = answeredCount + (hasPepFlag && fundOriginAnswered ? 1 : 0);

  const renderYesNoRadio = (questionId: string, value: boolean | undefined, yesLabel = 'Yes') => {
    return (
      <div className='flex items-center gap-4 mt-3'>
        {/* Yes Option */}
        <div
          onClick={() => updatePepResponse(questionId, true)}
          className='flex cursor-pointer items-center gap-2 group'
        >
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
              value === true
                ? 'border-blue-600'
                : 'border-gray-300 group-hover:border-blue-400'
            )}
          >
            {value === true && <div className='h-2.5 w-2.5 rounded-full bg-blue-600' />}
          </div>
          <span className='text-sm text-gray-700'>{yesLabel}</span>
        </div>

        {/* No Option */}
        <div
          onClick={() => updatePepResponse(questionId, false)}
          className='flex cursor-pointer items-center gap-2 group'
        >
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
              value === false
                ? 'border-blue-600'
                : 'border-gray-300 group-hover:border-blue-400'
            )}
          >
            {value === false && <div className='h-2.5 w-2.5 rounded-full bg-blue-600' />}
          </div>
          <span className='text-sm text-gray-700'>No</span>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">PEP & Sanctions Screening</h3>
        <p className="text-sm text-gray-500">Answer the following questions about political exposure and sanctions</p>
        <div className="mt-2 flex justify-center">
          {allAnswered ? (
            <Badge
              className={hasPepFlag
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
              }
            >
              {hasPepFlag ? "Manual Compliance Review Required" : "Clear - All questions answered No"}
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
              {displayAnsweredCount}/{totalQuestions} questions answered
            </Badge>
          )}
        </div>
      </div>

      <div className='space-y-4'>
        {PEP_QUESTIONS.map((q) => (
          <Card key={q.id} className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <p className='text-sm font-medium text-gray-900 leading-relaxed'>{q.question}</p>
              {renderYesNoRadio(q.id, pepResponses[q.id])}
            </CardContent>
          </Card>
        ))}
      </div>

      {hasPepFlag && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="bg-amber-50 border-amber-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">Manual Compliance Review Required</p>
                  <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                    Based on your responses, this application will be flagged for manual compliance review and cannot be automatically approved. Additional documentation may be requested.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Additional Verification</h4>

            <Card className="border-amber-200 shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {FUND_ORIGIN_QUESTION.question} <span className="text-red-500">*</span>
                </p>
                {renderYesNoRadio(
                  FUND_ORIGIN_QUESTION.id,
                  pepResponses[FUND_ORIGIN_QUESTION.id],
                  "Yes, I confirm"
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200 shadow-none mt-6">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 leading-relaxed">
            <span className="font-semibold">Sanctions Screening:</span> All clients are automatically screened against OFAC SDN, OFAC Consolidated Sanctions, FinCEN 311, UN Security Council, and EU Consolidated Sanctions lists.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
