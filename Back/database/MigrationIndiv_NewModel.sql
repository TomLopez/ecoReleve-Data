DECLARE @output table ( id int)


-----------------------------------INSERT dynProp and Linked type_DynProp -------------------------------------------------------------
INSERT INTO  [NewModelERD].[dbo].IndividualDynProp (Name,TypeProp)
OUTPUT inserted.ID into @output
 Values ('Release_Ring_Position',1),
('Release_Ring_Color',1),
('Release_Ring_Code',1),
('Breeding_Ring_Position',1),
('Breeding_Ring_Color',1),
('Breeding_Ring_Code',1),
('Chip_Code',1),
('Mark_Color_1',1),
('Mark_Position_1',1),
('Mark_Color_2',1),
('Mark_Position_2',1),
('Origin',1),
('Comments',1),
('Mark_code_1',1),
('Mark_code_2',1),
('Individual_Status',1),
('Monitoring_Status',1),
('Survey_type',1),
('Sex',1)

INSERT INTO  [NewModelERD].[dbo].IndividualType_IndividualDynProp (FK_IndividualDynProp ,FK_IndividualType,Required)
SELECT id , 1 ,1
FROM @output
GO

-----------------------------------INSERT Static Prop Values -------------------------------------------------------------
INSERT INTO [NewModelERD].[dbo].Individual (
[creationDate],
Age,
Species,
Birth_date,
Death_date,
Original_ID
)
SELECT o.[Creation_date]
      ,[id2@Thes_Age_Precision]
	  ,[id34@TCaracThes_Species_Precision]
      ,[id35@Birth_date]
      ,[id36@Death_date]
	  ,'eReleve_'+CONVERT(VARCHAR,Individual_Obj_PK)
FROM [ECWP-eReleveData].[dbo].[TViewIndividual] I
JOIN [ECWP-eReleveData].[dbo].TObj_Objects o on I.Individual_Obj_PK = o.Object_Pk
GO

-----------------------------------INSERT Sex in Dynamic Prop Values -------------------------------------------------------------
INSERT INTO [NewModelERD].[dbo].IndividualDynPropValue(
		[StartDate]
      ,[ValueString]
      ,[FK_IndividualDynProp]
      ,[FK_Individual]
) 
SELECT I.[creationDate],
		IV.[id30@TCaracThes_Sex_Precision],
		(SELECT ID FROM [NewModelERD].[dbo].IndividualDynProp WHERE Name = 'Sex'),
		I.ID
FROM [ECWP-eReleveData].[dbo].[TViewIndividual] IV 
JOIN [NewModelERD].[dbo].Individual I ON 'eReleve_'+CONVERT(VARCHAR,IV.Individual_Obj_PK) = I.Original_ID
GO

-----------------------------------INSERT Dynamic Prop Values -------------------------------------------------------------
INSERT INTO [NewModelERD].[dbo].IndividualDynPropValue(
		[StartDate]
      ,[ValueInt]
      ,[ValueString]
      ,[ValueDate]
      ,[ValueFloat]
      ,[FK_IndividualDynProp]
      ,[FK_Individual]
)

SELECT
val.begin_date,
Case 
	WHEN dp.TypeProp = 'Integer' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'Integer' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueInt,
Case 
	WHEN dp.TypeProp = 'String' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'String' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueString,
Case 
	WHEN dp.TypeProp = 'Date' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'Date' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueDate,
Case 
	WHEN dp.TypeProp = 'Float' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'Float' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueFloat,
dp.ID,
I_I.ID
FROM [ECWP-eReleveData].[dbo].[TObj_Carac_value] val 
JOIN [ECWP-eReleveData].[dbo].[TObj_Carac_type] typ on typ.Carac_type_Pk = val.Fk_carac
JOIN [NewModelERD].[dbo].IndividualDynProp dp ON 'TCaracThes_'+dp.Name = typ.name or 'TCarac_'+dp.Name = typ.name or  'Thes_'+dp.Name = typ.name
JOIN [NewModelERD].[dbo].Individual I_I ON  'eReleve_'+CONVERT(VARCHAR,val.fk_object) = I_I.Original_ID

