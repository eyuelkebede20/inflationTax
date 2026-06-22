 the logic has changed on this one because this is a duzy, input -
last year's taxable amount or tax(tax is
TOT(adjustable + Profit tax
=IF(G4<=7200,G4*0,IF(G4<=19800,G4*0.1-720,IF(G4
<=38400,G4*0.15-1710,IF(G4<=63000,G4*0.2-3630,I
F(G4<=93600,G4*0.25-6780,IF(G4<=130800,G4*0.3-1
1460,IF(G4>130800,G4\*0.35-18000)))))))),

)

so User inputs either the last year's taxable amount or the total taxable amount ... if they input the tax then we calculate the real amount X from that ... and then multiply it with the curfew I told you about and then have a new number and also use that number X to multiply it with 15.2% inflation and then we find the difference of these two curfew values and then add it to the last year's tax

for example let's say there is a person who wanted to calculate this year's difference from last year's.

Route 1: let's say he had 450,000 then that amount then when he input that we get 50,370 that is the tax we leave this and multiply 450,000 with the index/curfew/ then get 135000, then again we try that 450,000 with the inflation rate of 15.2% and get a new 518,400 and then multiply it with the curfew finally get 25920 now we find the difference between these two and get 12,420 and this is the difference so we add this ifference with last year's tax of 50,370 and get 62790

Now the idea here is knowing how much a person is supposed to pay considering the new curfew rule plus inflation and this way we can get it

ROute two would be if they input the tax then it calculates the taxable amount and then ROUTE 1

layout should be as it is but ver informative and also please have a language change from OM | AMHARIC | ENGLISH
